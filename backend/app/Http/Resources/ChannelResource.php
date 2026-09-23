<?php

namespace App\Http\Resources;

use App\Enums\ChannelMemberStatus;
use App\Enums\ChannelType;
use App\Models\ChannelMember;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChannelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type?->value,
            'description' => $this->description,
            'created_by' => $this->created_by,
            'membership_status' => $this->membershipStatusFor($request),
            'can_open' => $this->canOpenFor($request),
            'created_at' => $this->created_at?->toIso8601String(),
            'members' => ChannelMemberResource::collection($this->whenLoaded('members')),
        ];
    }

    private function membershipStatusFor(Request $request): ?string
    {
        if (! $request->user()) {
            return null;
        }

        if ($this->type === ChannelType::Public) {
            return 'active';
        }

        $status = ChannelMember::where('channel_id', $this->id)
            ->where('user_id', $request->user()->id)
            ->value('status');

        if ($status instanceof ChannelMemberStatus) {
            return $status->value;
        }

        return $status ?: null;
    }

    private function canOpenFor(Request $request): bool
    {
        return $this->membershipStatusFor($request) === 'active';
    }
}
