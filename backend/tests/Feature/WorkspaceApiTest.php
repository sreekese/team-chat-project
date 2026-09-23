<?php

namespace Tests\Feature;

use App\Enums\WorkspaceMemberRole;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_their_workspaces(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create();
        WorkspaceMember::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role' => WorkspaceMemberRole::Member,
        ]);

        $other = Workspace::factory()->create();

        $this->actingAs($user)->getJson('/api/workspaces')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $workspace->id);
    }

    public function test_user_can_create_workspace_and_becomes_owner(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/workspaces', [
            'name' => 'New Team',
            'description' => 'A brand new workspace',
        ])->assertCreated()
            ->assertJsonPath('data.name', 'New Team');

        $this->assertDatabaseHas('workspaces', ['name' => 'New Team', 'owner_id' => $user->id])
            ->assertDatabaseHas('workspace_members', [
                'workspace_id' => Workspace::where('name', 'New Team')->first()->id,
                'user_id' => $user->id,
                'role' => WorkspaceMemberRole::Owner->value,
            ]);
    }

    public function test_workspace_with_duplicate_name_still_creates_with_unique_slug(): void
    {
        Workspace::factory()->create(['name' => 'Acme Inc', 'slug' => 'acme-inc']);
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/workspaces', [
            'name' => 'Acme Inc',
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Acme Inc')
            ->assertJsonPath('data.slug', 'acme-inc-1');

        $this->assertSame(2, Workspace::where('name', 'Acme Inc')->count());
    }

    public function test_non_member_cannot_view_workspace(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create();

        $this->actingAs($user)->getJson("/api/workspaces/{$workspace->id}")
            ->assertStatus(403);
    }

    public function test_owner_can_list_members(): void
    {
        $owner = User::factory()->create();
        $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
        WorkspaceMember::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $owner->id,
            'role' => WorkspaceMemberRole::Owner,
        ]);
        $peer = User::factory()->create();
        WorkspaceMember::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $peer->id,
            'role' => WorkspaceMemberRole::Member,
        ]);

        $this->actingAs($owner)->getJson("/api/workspaces/{$workspace->id}/members")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_owner_can_add_member_by_email(): void
    {
        $owner = User::factory()->create();
        $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
        WorkspaceMember::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $owner->id,
            'role' => WorkspaceMemberRole::Owner,
        ]);
        $peer = User::factory()->create();

        $this->actingAs($owner)->postJson("/api/workspaces/{$workspace->id}/members", [
            'email' => $peer->email,
        ])->assertCreated()
            ->assertJsonPath('data.user.id', $peer->id);

        $this->assertDatabaseHas('workspace_members', [
            'workspace_id' => $workspace->id,
            'user_id' => $peer->id,
            'role' => WorkspaceMemberRole::Member->value,
        ]);
    }

    public function test_member_cannot_add_members(): void
    {
        $member = User::factory()->create();
        $workspace = Workspace::factory()->create();
        WorkspaceMember::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $member->id,
            'role' => WorkspaceMemberRole::Member,
        ]);
        $peer = User::factory()->create();

        $this->actingAs($member)->postJson("/api/workspaces/{$workspace->id}/members", [
            'email' => $peer->email,
        ])->assertStatus(403);
    }

    public function test_owner_can_remove_member(): void
    {
        $owner = User::factory()->create();
        $workspace = Workspace::factory()->create(['owner_id' => $owner->id]);
        WorkspaceMember::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $owner->id,
            'role' => WorkspaceMemberRole::Owner,
        ]);
        $peer = User::factory()->create();
        WorkspaceMember::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $peer->id,
            'role' => WorkspaceMemberRole::Member,
        ]);

        $this->actingAs($owner)->deleteJson("/api/workspaces/{$workspace->id}/members/{$peer->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('workspace_members', [
            'workspace_id' => $workspace->id,
            'user_id' => $peer->id,
        ]);
    }

    public function test_user_can_join_workspace_by_invite_code(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create(['invite_code' => '123456']);

        $this->actingAs($user)->postJson('/api/workspaces/join', [
            'invite_code' => '123456',
        ])->assertOk()
            ->assertJsonPath('data.id', $workspace->id);

        $this->assertDatabaseHas('workspace_members', [
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role' => WorkspaceMemberRole::Member->value,
        ]);
    }

    public function test_join_with_invalid_invite_code_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/workspaces/join', [
            'invite_code' => 'nope',
        ])->assertStatus(422);
    }
}
