<?php

namespace App\Http\Controllers\Api;

use App\Enums\ChannelType;
use App\Enums\ChannelMemberStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ChannelResource;
use App\Models\Channel;
use App\Models\ChannelMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class DirectMessageController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $channelIds = ChannelMember::where('user_id', $request->user()->id)
            ->where('status', ChannelMemberStatus::Active->value)
            ->pluck('channel_id');

        $dms = Channel::where('type', ChannelType::Dm)
            ->whereIn('id', $channelIds)
            ->with(['members.user'])
            ->withCount('messages')
            ->orderBy('updated_at', 'desc')
            ->get();

        return ChannelResource::collection($dms);
    }

    public function store(Request $request): ChannelResource
    {
        $peerId = (int) $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ])['user_id'];

        if ($peerId === $request->user()->id) {
            throw ValidationException::withMessages([
                'user_id' => ['You cannot message yourself.'],
            ]);
        }

        $peer = User::findOrFail($peerId);

        $dm = Channel::where('type', ChannelType::Dm)
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

            $dm = Channel::create([
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

    public function destroy(Request $request, Channel $channel): Response
    {
        $member = $channel->members()
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $member->delete();

        return response()->noContent();
    }
}
