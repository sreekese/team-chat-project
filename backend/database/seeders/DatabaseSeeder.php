<?php

namespace Database\Seeders;

use App\Enums\ChannelType;
use App\Enums\WorkspaceMemberRole;
use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\Message;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $alice = User::factory()->create([
            'name' => 'Alice Admin',
            'username' => 'alice',
            'email' => 'alice@example.com',
        ]);
        $bob = User::factory()->create([
            'name' => 'Bob Builder',
            'username' => 'bob',
            'email' => 'bob@example.com',
        ]);
        $carol = User::factory()->create([
            'name' => 'Carol Coder',
            'username' => 'carol',
            'email' => 'carol@example.com',
        ]);

        $workspace = Workspace::create([
            'name' => 'Acme Inc',
            'slug' => 'acme',
            'description' => 'Team workspace for Acme Inc',
            'owner_id' => $alice->id,
            'settings' => [
                'allow_guests' => false,
                'max_file_size_mb' => 25,
            ],
        ]);

        WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id' => $alice->id,
            'role' => WorkspaceMemberRole::Owner,
        ]);
        WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id' => $bob->id,
            'role' => WorkspaceMemberRole::Admin,
        ]);
        WorkspaceMember::create([
            'workspace_id' => $workspace->id,
            'user_id' => $carol->id,
            'role' => WorkspaceMemberRole::Member,
        ]);

        $general = Channel::create([
            'workspace_id' => $workspace->id,
            'name' => 'general',
            'slug' => 'general',
            'type' => ChannelType::Public,
            'description' => 'Company-wide announcements and general chat',
            'created_by' => $alice->id,
        ]);
        Channel::create([
            'workspace_id' => $workspace->id,
            'name' => 'random',
            'slug' => 'random',
            'type' => ChannelType::Public,
            'description' => 'Off-topic fun',
            'created_by' => $alice->id,
        ]);
        $tech = Channel::create([
            'workspace_id' => $workspace->id,
            'name' => 'engineering',
            'slug' => 'engineering',
            'type' => ChannelType::Private,
            'description' => 'Private engineering channel',
            'created_by' => $alice->id,
        ]);
        $dm = Channel::create([
            'workspace_id' => $workspace->id,
            'name' => 'alice-bob',
            'slug' => 'dm-alice-bob',
            'type' => ChannelType::Dm,
            'created_by' => $alice->id,
        ]);

        foreach ([$general, $tech] as $channel) {
            ChannelMember::create(['channel_id' => $channel->id, 'user_id' => $alice->id]);
            ChannelMember::create(['channel_id' => $channel->id, 'user_id' => $bob->id]);
        }
        ChannelMember::create(['channel_id' => $tech->id, 'user_id' => $carol->id]);
        ChannelMember::create(['channel_id' => $dm->id, 'user_id' => $alice->id]);
        ChannelMember::create(['channel_id' => $dm->id, 'user_id' => $bob->id]);

        $parent = Message::create([
            'workspace_id' => $workspace->id,
            'channel_id' => $general->id,
            'user_id' => $alice->id,
            'body' => 'Welcome to the Acme workspace! 🎉',
        ]);

        $thread = Message::create([
            'workspace_id' => $workspace->id,
            'channel_id' => $general->id,
            'user_id' => $bob->id,
            'parent_id' => $parent->id,
            'body' => 'Thanks Alice, excited to be here.',
        ]);

        $thread->reactions()->create([
            'user_id' => $carol->id,
            'emoji' => '👍',
        ]);
    }
}
