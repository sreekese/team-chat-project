<?php

namespace App\Http\Controllers\Api;

use App\Enums\ChannelType;
use App\Enums\ChannelMemberStatus;
use App\Enums\WorkspaceMemberRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreChannelRequest;
use App\Http\Resources\ChannelResource;
use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class ChannelController extends Controller
{
    public function index(Request $request, Workspace $workspace): AnonymousResourceCollection
    {
        $this->authorize('view', $workspace);

        $memberChannelIds = ChannelMember::where('user_id', $request->user()->id)
            ->where('status', ChannelMemberStatus::Active->value)
            ->pluck('channel_id');

        $pendingChannelIds = ChannelMember::where('user_id', $request->user()->id)
            ->where('status', ChannelMemberStatus::Pending->value)
            ->pluck('channel_id');

        $channels = $workspace->channels()
            ->where(function ($query) use ($memberChannelIds, $pendingChannelIds) {
                $query->where('type', 'public')
                    ->orWhereIn('id', $memberChannelIds)
                    ->orWhere(function ($query) use ($pendingChannelIds) {
                        $query->whereIn('id', $pendingChannelIds)
                            ->where('type', '!=', ChannelType::Dm);
                    });
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

        $channel->members()->create([
            'user_id' => $request->user()->id,
            'status' => ChannelMemberStatus::Active->value,
        ]);

        foreach (array_unique($memberIds) as $memberId) {
            if ((int) $memberId === $request->user()->id) {
                continue;
            }

            $channel->members()->create([
                'user_id' => $memberId,
                'status' => ChannelMemberStatus::Pending->value,
            ]);
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

    public function accept(Request $request, Workspace $workspace, Channel $channel): ChannelResource
    {
        $this->authorize('view', $workspace);

        $member = $channel->members()
            ->where('user_id', $request->user()->id)
            ->where('status', ChannelMemberStatus::Pending->value)
            ->firstOrFail();

        $member->update(['status' => ChannelMemberStatus::Active->value]);

        $channel->load('members.user');

        return new ChannelResource($channel);
    }

    public function decline(Request $request, Workspace $workspace, Channel $channel): Response
    {
        $this->authorize('view', $workspace);

        $channel->members()
            ->where('user_id', $request->user()->id)
            ->where('status', ChannelMemberStatus::Pending->value)
            ->delete();

        return response()->noContent();
    }

    public function dms(Request $request, Workspace $workspace): ChannelResource
    {
        $this->authorize('view', $workspace);

        $peerId = (int) $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ])['user_id'];

        if ($peerId === $request->user()->id) {
            throw ValidationException::withMessages([
                'user_id' => ['You cannot message yourself.'],
            ]);
        }

        $peer = User::findOrFail($peerId);

        WorkspaceMember::firstOrCreate(
            ['workspace_id' => $workspace->id, 'user_id' => $peer->id],
            ['role' => WorkspaceMemberRole::Member],
        );

        $dm = $workspace->channels()
            ->where('type', ChannelType::Dm)
            ->whereHas('members', fn ($q) => $q->where('user_id', $request->user()->id))
            ->whereHas('members', fn ($q) => $q->where('user_id', $peerId))
            ->withCount('members')
            ->get()
            ->firstWhere('members_count', 2);

        if (! $dm) {
            $usernames = collect([$request->user(), $peer])
                ->pluck('username')
                ->sort()
                ->implode('-');

            $dm = $workspace->channels()->create([
                'name' => $usernames,
                'type' => ChannelType::Dm,
                'created_by' => $request->user()->id,
            ]);

            $dm->members()->create([
                'user_id' => $request->user()->id,
                'status' => ChannelMemberStatus::Active->value,
            ]);
            $dm->members()->create([
                'user_id' => $peerId,
                'status' => ChannelMemberStatus::Active->value,
            ]);
        }

        $dm->load('members.user');

        return new ChannelResource($dm);
    }

    public function destroy(Request $request, Workspace $workspace, Channel $channel): Response
    {
        $this->authorize('delete', $channel);

        $channel->delete();

        return response()->noContent();
    }

    public function leave(Request $request, Workspace $workspace, Channel $channel): Response
    {
        $this->authorize('leave', $channel);

        $channel->members()
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->noContent();
    }
}
