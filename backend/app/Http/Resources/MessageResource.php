<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'channel_id' => $this->channel_id,
            'user_id' => $this->user_id,
            'parent_id' => $this->parent_id,
            'type' => $this->type?->value,
            'body' => $this->body,
            'edited_at' => $this->edited_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => new UserResource($this->whenLoaded('user')),
            'attachments' => MessageAttachmentResource::collection($this->whenLoaded('attachments')),
            'reactions' => MessageReactionResource::collection($this->whenLoaded('reactions')),
            'replies_count' => $this->whenCounted('replies'),
        ];
    }
}
