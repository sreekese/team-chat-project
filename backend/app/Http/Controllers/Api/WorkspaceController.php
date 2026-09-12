<?php

namespace App\Http\Controllers\Api;

use App\Enums\WorkspaceMemberRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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
}
