<?php

namespace App\Http\Resources;

use App\Models\MessageKeyWrap;
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
            'encrypted_body' => $this->encrypted_body,
            'body_iv' => $this->body_iv,
            'key_wraps' => $this->whenLoaded('keyWraps', fn () => $this->keyWraps->map(function (MessageKeyWrap $wrap): array {
                return [
                    'user_id' => $wrap->user_id,
                    'ephemeral_public_key' => $wrap->ephemeral_public_key,
                    'wrapped_key' => $wrap->wrapped_key,
                    'wrap_iv' => $wrap->wrap_iv,
                ];
            })->values()),
            'edited_at' => $this->edited_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => new UserResource($this->whenLoaded('user')),
            'attachments' => MessageAttachmentResource::collection($this->whenLoaded('attachments')),
            'reactions' => MessageReactionResource::collection($this->whenLoaded('reactions')),
            'replies' => MessageResource::collection($this->whenLoaded('replies')),
            'replies_count' => $this->whenCounted('replies'),
        ];
    }
}
