<?php

use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\WorkspaceMember;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('workspace.{id}', function ($user, $id) {
    if (! WorkspaceMember::where('workspace_id', $id)
        ->where('user_id', $user->id)
        ->exists()) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'username' => $user->username,
        'avatar_path' => $user->avatar_path,
        'status' => $user->status?->value,
    ];
});

Broadcast::channel('channel.{id}', function ($user, $id) {
    $channel = Channel::find($id);

    if (! $channel) {
        return false;
    }

    $isWorkspaceMember = WorkspaceMember::where('workspace_id', $channel->workspace_id)
        ->where('user_id', $user->id)
        ->exists();

    if (! $isWorkspaceMember) {
        return false;
    }

    if ($channel->type->value === 'public') {
        return ['id' => $user->id];
    }

    $isMember = ChannelMember::where('channel_id', $channel->id)
        ->where('user_id', $user->id)
        ->where('status', 'active')
        ->exists();

    return $isMember ? ['id' => $user->id] : false;
});
