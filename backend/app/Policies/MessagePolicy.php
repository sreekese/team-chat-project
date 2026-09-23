<?php

namespace App\Policies;

use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\Message;
use App\Models\User;
use App\Models\WorkspaceMember;
use Illuminate\Auth\Access\HandlesAuthorization;

class MessagePolicy
{
    use HandlesAuthorization;

    public function view(User $user, Message $message): bool
    {
        return $message->channel
            ? $this->canAccessChannel($user, $message->channel)
            : false;
    }

    public function create(User $user, Channel $channel): bool
    {
        return $this->canAccessChannel($user, $channel);
    }

    public function update(User $user, Message $message): bool
    {
        return $message->user_id === $user->id;
    }

    public function delete(User $user, Message $message): bool
    {
        return $message->user_id === $user->id;
    }

    protected function canAccessChannel(User $user, Channel $channel): bool
    {
        if ($channel->type->value === 'public') {
            return WorkspaceMember::where('workspace_id', $channel->workspace_id)
                ->where('user_id', $user->id)
                ->exists();
        }

        return $this->isChannelMember($user, $channel->id);
    }

    protected function isChannelMember(User $user, int $channelId): bool
    {
        return ChannelMember::where('channel_id', $channelId)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists();
    }
}
