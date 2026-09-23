<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkspaceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'invite_code' => $this->invite_code,
            'description' => $this->description,
            'logo_path' => $this->logo_path,
            'settings' => $this->settings,
            'owner_id' => $this->owner_id,
            'role' => $this->pivot?->role,
            'members_count' => $this->whenCounted('members'),
            'channels_count' => $this->whenCounted('channels'),
            'members' => WorkspaceMemberResource::collection($this->whenLoaded('members')),
            'channels' => ChannelResource::collection($this->whenLoaded('channels')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
