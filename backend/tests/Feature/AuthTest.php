<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Jane Doe',
            'username' => 'jane',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.username', 'jane')
            ->assertJsonStructure(['data' => ['id', 'username', 'email'], 'token']);
    }

    public function test_registration_requires_unique_username(): void
    {
        User::factory()->create(['username' => 'jane']);

        $this->postJson('/api/register', [
            'name' => 'Jane Doe',
            'username' => 'jane',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422)
            ->assertJsonValidationErrors('username');
    }

    public function test_user_can_login_with_username(): void
    {
        User::factory()->create([
            'username' => 'alice',
            'email' => 'alice@example.com',
            'password' => 'password123',
        ]);

        $this->postJson('/api/login', [
            'login' => 'alice',
            'password' => 'password123',
        ])->assertOk()
            ->assertJsonPath('data.username', 'alice')
            ->assertJsonStructure(['token']);
    }

    public function test_user_can_login_with_email(): void
    {
        User::factory()->create([
            'username' => 'alice',
            'email' => 'alice@example.com',
            'password' => 'password123',
        ]);

        $this->postJson('/api/login', [
            'login' => 'alice@example.com',
            'password' => 'password123',
        ])->assertOk();
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->create(['username' => 'alice', 'password' => 'password123']);

        $this->postJson('/api/login', [
            'login' => 'alice',
            'password' => 'wrong-password',
        ])->assertStatus(422)
            ->assertJsonValidationErrors('login');
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.username', $user->username);
    }

    public function test_logout_revokes_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }
}
