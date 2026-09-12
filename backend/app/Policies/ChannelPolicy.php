<?php

namespace App\Policies;

use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Auth\Access\HandlesAuthorization;

class ChannelPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Channel $channel, ?int $workspaceId = null): bool
    {
        $workspaceId ??= $channel->workspace_id;
        $isWorkspaceMember = WorkspaceMember::where('workspace_id', $workspaceId)
            ->where('user_id', $user->id)
            ->exists();

        if (! $isWorkspaceMember) {
            return false;
        }

        if ($channel->type->value === 'public') {
            return true;
        }

        return ChannelMember::where('channel_id', $channel->id)
            ->where('user_id', $user->id)
            ->exists();
    }

    public function create(User $user, ?Channel $channel = null, ?int $workspaceId = null): bool
    {
        if ($channel) {
            return $this->view($user, $channel, $channel->workspace_id);
        }

        return WorkspaceMember::where('workspace_id', $workspaceId)
            ->where('user_id', $user->id)
            ->exists();
    }

    public function store(User $user, Workspace $workspace): bool
    {
        return WorkspaceMember::where('workspace_id', $workspace->id)
            ->where('user_id', $user->id)
            ->exists();
    }
}
