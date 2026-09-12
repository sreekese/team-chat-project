<?php

namespace App\Policies;

use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\Message;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class MessagePolicy
{
    use HandlesAuthorization;

    public function view(User $user, Message $message): bool
    {
        return $this->isChannelMember($user, $message->channel_id);
    }

    public function create(User $user, Channel $channel): bool
    {
        return $this->isChannelMember($user, $channel->id);
    }

    public function update(User $user, Message $message): bool
    {
        return $message->user_id === $user->id;
    }

    public function delete(User $user, Message $message): bool
    {
        return $message->user_id === $user->id;
    }

    protected function isChannelMember(User $user, int $channelId): bool
    {
        return ChannelMember::where('channel_id', $channelId)
            ->where('user_id', $user->id)
            ->exists();
    }
}
