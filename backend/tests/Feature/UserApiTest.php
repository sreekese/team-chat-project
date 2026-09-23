<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_search_other_users(): void
    {
        $me = User::factory()->create(['username' => 'me']);
        $alex = User::factory()->create(['username' => 'alex', 'name' => 'Alex Smith']);
        User::factory()->create(['username' => 'alice', 'name' => 'Alice Doe']);

        $this->actingAs($me)->getJson('/api/users/search?q=alex')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.username', 'alex');

        $this->actingAs($me)->getJson('/api/users/search?q=me')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_search_without_query_returns_users(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($me)->getJson('/api/users/search')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $other->id);
    }
}