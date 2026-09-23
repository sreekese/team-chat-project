<?php

namespace Tests\Feature;

use App\Enums\ChannelType;
use App\Enums\ChannelMemberStatus;
use App\Enums\WorkspaceMemberRole;
use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChannelApiTest extends TestCase
{
    use RefreshDatabase;

    private function workspaceWithMember(User $user): Workspace
    {
        $workspace = Workspace::factory()->create();
        WorkspaceMember::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role' => WorkspaceMemberRole::Member,
        ]);

        return $workspace;
    }

    public function test_member_sees_public_and_own_private_channels(): void
    {
        $user = User::factory()->create();
        $workspace = $this->workspaceWithMember($user);

        Channel::factory()->create(['workspace_id' => $workspace->id, 'name' => 'general']);
        $private = Channel::factory()->private()->create(['workspace_id' => $workspace->id]);
        ChannelMember::factory()->create(['channel_id' => $private->id, 'user_id' => $user->id]);
        $hidden = Channel::factory()->private()->create(['workspace_id' => $workspace->id]);

        $this->actingAs($user)->getJson("/api/workspaces/{$workspace->id}/channels")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonMissing(['id' => $hidden->id]);
    }

    public function test_member_can_create_channel(): void
    {
        $user = User::factory()->create();
        $workspace = $this->workspaceWithMember($user);
        $peer = User::factory()->create();

        $this->actingAs($user)->postJson("/api/workspaces/{$workspace->id}/channels", [
            'name' => 'engineering',
            'type' => 'private',
            'member_ids' => [$peer->id],
        ])->assertCreated()
            ->assertJsonPath('data.name', 'engineering');

        $this->assertDatabaseHas('channels', [
            'workspace_id' => $workspace->id,
            'name' => 'engineering',
            'type' => ChannelType::Private->value,
        ]);

        $channel = Channel::where('name', 'engineering')->first();
        $this->assertDatabaseHas('channel_members', [
            'channel_id' => $channel->id,
            'user_id' => $user->id,
            'status' => ChannelMemberStatus::Active->value,
        ])->assertDatabaseHas('channel_members', [
            'channel_id' => $channel->id,
            'user_id' => $peer->id,
            'status' => ChannelMemberStatus::Pending->value,
        ]);
    }

    public function test_invited_user_can_accept_channel_invite(): void
    {
        $owner = User::factory()->create();
        $invitee = User::factory()->create();
        $workspace = $this->workspaceWithMember($owner);
        WorkspaceMember::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $invitee->id,
            'role' => WorkspaceMemberRole::Member,
        ]);

        $channel = Channel::factory()->private()->create(['workspace_id' => $workspace->id]);
        ChannelMember::factory()->create([
            'channel_id' => $channel->id,
            'user_id' => $owner->id,
            'status' => ChannelMemberStatus::Active->value,
        ]);
        ChannelMember::factory()->create([
            'channel_id' => $channel->id,
            'user_id' => $invitee->id,
            'status' => ChannelMemberStatus::Pending->value,
        ]);

        $this->actingAs($invitee)->getJson("/api/workspaces/{$workspace->id}/channels")
            ->assertOk()
            ->assertJsonPath('data.0.membership_status', ChannelMemberStatus::Pending->value)
            ->assertJsonPath('data.0.can_open', false);

        $this->actingAs($invitee)->getJson("/api/workspaces/{$workspace->id}/channels/{$channel->id}")
            ->assertStatus(403);

        $this->actingAs($invitee)->postJson("/api/workspaces/{$workspace->id}/channels/{$channel->id}/accept")
            ->assertOk()
            ->assertJsonPath('data.membership_status', ChannelMemberStatus::Active->value)
            ->assertJsonPath('data.can_open', true);

        $this->assertDatabaseHas('channel_members', [
            'channel_id' => $channel->id,
            'user_id' => $invitee->id,
            'status' => ChannelMemberStatus::Active->value,
        ]);
    }

    public function test_invited_user_can_decline_channel_invite(): void
    {
        $owner = User::factory()->create();
        $invitee = User::factory()->create();
        $workspace = $this->workspaceWithMember($owner);
        WorkspaceMember::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $invitee->id,
            'role' => WorkspaceMemberRole::Member,
        ]);
        $channel = Channel::factory()->private()->create(['workspace_id' => $workspace->id]);

        ChannelMember::factory()->create([
            'channel_id' => $channel->id,
            'user_id' => $invitee->id,
            'status' => ChannelMemberStatus::Pending->value,
        ]);

        $this->actingAs($invitee)->deleteJson("/api/workspaces/{$workspace->id}/channels/{$channel->id}/decline")
            ->assertNoContent();

        $this->assertDatabaseMissing('channel_members', [
            'channel_id' => $channel->id,
            'user_id' => $invitee->id,
        ]);
    }

    public function test_non_member_cannot_create_channel(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create();

        $this->actingAs($user)->postJson("/api/workspaces/{$workspace->id}/channels", [
            'name' => 'intruder',
            'type' => 'public',
        ])->assertStatus(403);
    }

    public function test_non_member_cannot_view_private_channel(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create();
        $private = Channel::factory()->private()->create(['workspace_id' => $workspace->id]);

        $this->actingAs($user)->getJson("/api/workspaces/{$workspace->id}/channels/{$private->id}")
            ->assertStatus(403);
    }

    public function test_member_can_find_or_create_dm_channel(): void
    {
        $user = User::factory()->create();
        $workspace = $this->workspaceWithMember($user);
        $peer = User::factory()->create();
        WorkspaceMember::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $peer->id,
            'role' => WorkspaceMemberRole::Member,
        ]);

        $first = $this->actingAs($user)->postJson("/api/workspaces/{$workspace->id}/dms", [
            'user_id' => $peer->id,
        ])->assertCreated()
            ->assertJsonPath('data.type', ChannelType::Dm->value)
            ->assertJsonCount(2, 'data.members');

        $dmId = $first->json('data.id');

        $this->assertDatabaseHas('channels', [
            'id' => $dmId,
            'workspace_id' => $workspace->id,
            'type' => ChannelType::Dm->value,
        ]);

        $this->actingAs($user)->postJson("/api/workspaces/{$workspace->id}/dms", [
            'user_id' => $peer->id,
        ])->assertOk()
            ->assertJsonPath('data.id', $dmId);
    }

    public function test_member_can_dm_any_existing_user(): void
    {
        $user = User::factory()->create();
        $workspace = $this->workspaceWithMember($user);
        $peer = User::factory()->create();

        $this->actingAs($user)->postJson("/api/workspaces/{$workspace->id}/dms", [
            'user_id' => $peer->id,
        ])->assertCreated()
            ->assertJsonPath('data.type', ChannelType::Dm->value)
            ->assertJsonCount(2, 'data.members');

        $this->assertDatabaseHas('workspace_members', [
            'workspace_id' => $workspace->id,
            'user_id' => $peer->id,
        ]);
        $this->assertDatabaseHas('channel_members', [
            'user_id' => $peer->id,
            'status' => ChannelMemberStatus::Active->value,
        ]);
    }
}
