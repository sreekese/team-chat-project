<?php

namespace Database\Factories;

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Channel>
 */
class ChannelFactory extends Factory
{
    protected $model = Channel::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => fake()->words(2, true),
            'slug' => fn (array $attributes) => Str::slug($attributes['name']).'-'.Str::lower(Str::random(6)),
            'type' => ChannelType::Public,
            'description' => fake()->sentence(),
            'created_by' => User::factory(),
        ];
    }

    public function private(): static
    {
        return $this->state(fn (array $attributes) => ['type' => ChannelType::Private]);
    }

    public function dm(): static
    {
        return $this->state(fn (array $attributes) => ['type' => ChannelType::Dm]);
    }
}
