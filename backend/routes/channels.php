<?php

use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\WorkspaceMember;
use Illuminate\Support\Facades\Broadcast;

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
        ->exists();

    return $isMember ? ['id' => $user->id] : false;
});
