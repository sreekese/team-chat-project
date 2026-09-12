<?php

namespace Database\Factories;

use App\Enums\MessageType;
use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    protected $model = Message::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'channel_id' => Channel::factory(),
            'user_id' => User::factory(),
            'parent_id' => null,
            'type' => MessageType::Text,
            'body' => fake()->sentence(),
        ];
    }
}
