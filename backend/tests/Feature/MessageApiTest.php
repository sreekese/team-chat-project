<?php

namespace Tests\Feature;

use App\Enums\WorkspaceMemberRole;
use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\Message;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageApiTest extends TestCase
{
    use RefreshDatabase;

    private function memberInChannel(User $user): array
    {
        $workspace = Workspace::factory()->create();
        $channel = Channel::factory()->create(['workspace_id' => $workspace->id]);

        WorkspaceMember::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role' => WorkspaceMemberRole::Member,
        ]);
        ChannelMember::factory()->create(['channel_id' => $channel->id, 'user_id' => $user->id]);

        return [$workspace, $channel];
    }

    public function test_member_can_send_message(): void
    {
        $user = User::factory()->create();
        [$workspace, $channel] = $this->memberInChannel($user);

        $this->actingAs($user)->postJson("/api/workspaces/{$workspace->id}/channels/{$channel->id}/messages", [
            'body' => 'Hello world',
        ])->assertCreated()
            ->assertJsonPath('data.body', 'Hello world')
            ->assertJsonPath('data.user_id', $user->id);

        $this->assertDatabaseHas('messages', ['channel_id' => $channel->id, 'body' => 'Hello world']);
    }

    public function test_non_member_cannot_send_message_to_private_channel(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create();
        $private = Channel::factory()->private()->create(['workspace_id' => $workspace->id]);

        $this->actingAs($user)->postJson("/api/workspaces/{$workspace->id}/channels/{$private->id}/messages", [
            'body' => 'intrusion',
        ])->assertStatus(403);
    }

    public function test_member_can_list_messages(): void
    {
        $user = User::factory()->create();
        [$workspace, $channel] = $this->memberInChannel($user);

        Message::factory()->count(3)->create([
            'workspace_id' => $workspace->id,
            'channel_id' => $channel->id,
            'user_id' => $user->id,
        ]);

        $this->actingAs($user)->getJson("/api/workspaces/{$workspace->id}/channels/{$channel->id}/messages")
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_member_can_react_to_message(): void
    {
        $user = User::factory()->create();
        [$workspace, $channel] = $this->memberInChannel($user);
        $message = Message::factory()->create([
            'workspace_id' => $workspace->id,
            'channel_id' => $channel->id,
            'user_id' => $user->id,
        ]);

        $this->actingAs($user)->postJson(
            "/api/workspaces/{$workspace->id}/channels/{$channel->id}/messages/{$message->id}/react",
            ['emoji' => '🔥']
        )->assertOk();

        $this->assertDatabaseHas('message_reactions', [
            'message_id' => $message->id,
            'user_id' => $user->id,
            'emoji' => '🔥',
        ]);
    }

    public function test_author_can_delete_message(): void
    {
        $user = User::factory()->create();
        [$workspace, $channel] = $this->memberInChannel($user);
        $message = Message::factory()->create([
            'workspace_id' => $workspace->id,
            'channel_id' => $channel->id,
            'user_id' => $user->id,
        ]);

        $this->actingAs($user)->deleteJson("/api/workspaces/{$workspace->id}/channels/{$channel->id}/messages/{$message->id}")
            ->assertNoContent();

        $this->assertSoftDeleted('messages', ['id' => $message->id]);
    }

    public function test_non_author_cannot_delete_message(): void
    {
        $author = User::factory()->create();
        [$workspace, $channel] = $this->memberInChannel($author);
        $message = Message::factory()->create([
            'workspace_id' => $workspace->id,
            'channel_id' => $channel->id,
            'user_id' => $author->id,
        ]);

        $other = User::factory()->create();
        WorkspaceMember::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $other->id,
            'role' => WorkspaceMemberRole::Member,
        ]);
        ChannelMember::factory()->create(['channel_id' => $channel->id, 'user_id' => $other->id]);

        $this->actingAs($other)->deleteJson("/api/workspaces/{$workspace->id}/channels/{$channel->id}/messages/{$message->id}")
            ->assertStatus(403);
    }
}
