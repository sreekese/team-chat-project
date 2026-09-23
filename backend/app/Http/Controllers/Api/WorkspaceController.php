<?php

namespace App\Http\Controllers\Api;

use App\Enums\WorkspaceMemberRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AddWorkspaceMemberRequest;
use App\Http\Requests\Api\JoinWorkspaceRequest;
use App\Http\Requests\Api\StoreWorkspaceRequest;
use App\Http\Resources\WorkspaceMemberResource;
use App\Http\Resources\WorkspaceResource;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class WorkspaceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $workspaces = $request->user()
            ->workspaces()
            ->withCount(['members', 'channels'])
            ->orderBy('name')
            ->get();

        return WorkspaceResource::collection($workspaces);
    }

    public function store(StoreWorkspaceRequest $request): WorkspaceResource
    {
        $validated = $request->validated();

        $workspace = Workspace::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? null,
            'description' => $validated['description'] ?? null,
            'logo_path' => $validated['logo_path'] ?? null,
            'settings' => $validated['settings'] ?? [],
            'owner_id' => $request->user()->id,
        ]);

        WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id' => $request->user()->id,
            'role' => WorkspaceMemberRole::Owner,
        ]);

        return new WorkspaceResource($workspace);
    }

    public function show(Request $request, Workspace $workspace): WorkspaceResource
    {
        $this->authorize('view', $workspace);

        $workspace->load(['channels', 'members.user']);

        return new WorkspaceResource($workspace);
    }

    public function members(Request $request, Workspace $workspace): AnonymousResourceCollection
    {
        $this->authorize('view', $workspace);

        $members = $workspace->members()
            ->with('user')
            ->join('users', 'users.id', '=', 'workspace_members.user_id')
            ->orderBy('users.name')
            ->select('workspace_members.*')
            ->get();

        return WorkspaceMemberResource::collection($members);
    }

    public function addMember(AddWorkspaceMemberRequest $request, Workspace $workspace): WorkspaceMemberResource
    {
        $this->authorize('manageMembers', $workspace);

        $user = $request->validated('user_id')
            ? User::findOrFail($request->validated('user_id'))
            : User::where('email', $request->validated('email'))->firstOrFail();

        $member = WorkspaceMember::firstOrCreate(
            ['workspace_id' => $workspace->id, 'user_id' => $user->id],
            ['role' => WorkspaceMemberRole::Member],
        );

        $member->load('user');

        return new WorkspaceMemberResource($member);
    }

    public function removeMember(Request $request, Workspace $workspace, User $user): Response
    {
        $this->authorize('manageMembers', $workspace);

        if ($workspace->owner_id === $user->id) {
            throw ValidationException::withMessages([
                'user' => ['The workspace owner cannot be removed.'],
            ]);
        }

        $workspace->members()->where('user_id', $user->id)->delete();

        return response()->noContent();
    }

    public function regenerateInvite(Request $request, Workspace $workspace): WorkspaceResource
    {
        $this->authorize('manageMembers', $workspace);

        return new WorkspaceResource($workspace->regenerateInviteCode());
    }

    public function join(JoinWorkspaceRequest $request): WorkspaceResource
    {
        $workspace = Workspace::where('invite_code', $request->validated('invite_code'))->firstOrFail();

        if (! WorkspaceMember::where('workspace_id', $workspace->id)
            ->where('user_id', $request->user()->id)
            ->exists()) {
            WorkspaceMember::create([
                'workspace_id' => $workspace->id,
                'user_id' => $request->user()->id,
                'role' => WorkspaceMemberRole::Member,
            ]);
        }

        $workspace->loadCount(['members', 'channels']);

        return new WorkspaceResource($workspace);
    }

    public function destroy(Request $request, Workspace $workspace): Response
    {
        $this->authorize('delete', $workspace);

        DB::transaction(function () use ($workspace) {
            $workspace->channels()->delete();
            $workspace->members()->delete();
            $workspace->delete();
        });

        return response()->noContent();
    }
}