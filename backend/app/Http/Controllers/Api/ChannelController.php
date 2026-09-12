<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreChannelRequest;
use App\Http\Resources\ChannelResource;
use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ChannelController extends Controller
{
    public function index(Request $request, Workspace $workspace): AnonymousResourceCollection
    {
        $this->authorize('view', $workspace);

        $memberChannelIds = ChannelMember::where('user_id', $request->user()->id)
            ->pluck('channel_id');

        $channels = $workspace->channels()
            ->where(function ($query) use ($memberChannelIds) {
                $query->where('type', 'public')
                    ->orWhereIn('id', $memberChannelIds);
            })
            ->withCount('messages')
            ->orderBy('name')
            ->get();

        return ChannelResource::collection($channels);
    }

    public function store(StoreChannelRequest $request, Workspace $workspace): ChannelResource
    {
        $this->authorize('store', [Channel::class, $workspace]);

        $validated = $request->validated();
        $memberIds = $validated['member_ids'] ?? [];

        $channel = $workspace->channels()->create([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? null,
            'type' => $validated['type'],
            'description' => $validated['description'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        $channel->members()->create(['user_id' => $request->user()->id]);

        foreach (array_unique($memberIds) as $memberId) {
            if ((int) $memberId === $request->user()->id) {
                continue;
            }

            $channel->members()->create(['user_id' => $memberId]);
        }

        $channel->load('members.user');

        return new ChannelResource($channel);
    }

    public function show(Request $request, Workspace $workspace, Channel $channel): ChannelResource
    {
        $this->authorize('view', [$channel, $workspace->id]);

        $channel->load('members.user');

        return new ChannelResource($channel);
    }
}
