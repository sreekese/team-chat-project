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

    public function test_non_member_cannot_view_workspace(): void
    {
        $user = User::factory()->create();
        $workspace = Workspace::factory()->create();

        $this->actingAs($user)->getJson("/api/workspaces/{$workspace->id}")
            ->assertStatus(403);
    }
}
