<?php

namespace Database\Factories;

use App\Enums\ChannelMemberRole;
use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChannelMember>
 */
class ChannelMemberFactory extends Factory
{
    protected $model = ChannelMember::class;

    public function definition(): array
    {
        return [
            'channel_id' => Channel::factory(),
            'user_id' => User::factory(),
            'role' => ChannelMemberRole::Member,
        ];
    }
}
