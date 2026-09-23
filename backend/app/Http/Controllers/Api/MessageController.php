<?php

namespace App\Http\Controllers\Api;

use App\Enums\MessageType;
use App\Enums\ChannelMemberStatus;
use App\Events\MessageCreated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreMessageRequest;
use App\Http\Requests\Api\StoreReactionRequest;
use App\Http\Resources\MessageResource;
use App\Models\Channel;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\WorkspaceMember;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MessageController extends Controller
{
    public function index(Request $request, Workspace $workspace, Channel $channel): AnonymousResourceCollection
    {
        $this->authorize('view', [$channel, $workspace->id]);

        $messages = $channel->messages()
            ->with(['user', 'attachments', 'reactions.user', 'keyWraps'])
            ->withCount('replies')
            ->latest()
            ->simplePaginate(50);

        return MessageResource::collection($messages);
    }

    public function store(StoreMessageRequest $request, Workspace $workspace, Channel $channel): MessageResource
    {
        $this->authorize('create', [Message::class, $channel]);

        $validated = $request->validated();
        $file = $request->file('attachment');
        $encryptedBody = $validated['encrypted_body'] ?? null;
        $wraps = $this->keyWrapsFrom($validated['key_wraps'] ?? null);

        $message = $channel->messages()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $request->user()->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'type' => $file ? MessageType::File : ($validated['type'] ?? MessageType::Text),
            'body' => $file ? $file->getClientOriginalName() : ($encryptedBody ? null : ($validated['body'] ?? '')),
            'encrypted_body' => $encryptedBody ?: null,
            'body_iv' => $validated['body_iv'] ?? null,
        ]);

        if ($file) {
            $path = $file->store('attachments', 'local');

            MessageAttachment::create([
                'message_id' => $message->id,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'meta' => null,
            ]);

            $message->load('attachments');
        }

        if ($wraps !== []) {
            $memberIds = $this->eligibleRecipientIds($channel)
                ->map(fn ($id) => (int) $id)
                ->all();

            foreach ($wraps as $wrap) {
                if (! in_array($wrap['user_id'], $memberIds, true)) {
                    continue;
                }

                $message->keyWraps()->create($wrap + ['message_id' => $message->id]);
            }
        }

        $message->load(['user', 'keyWraps']);

        broadcast(new MessageCreated($message));

        return new MessageResource($message);
    }

    public function show(Request $request, Workspace $workspace, Channel $channel, Message $message): MessageResource
    {
        $this->authorize('view', $message);

        $message->load([
            'user',
            'attachments',
            'reactions.user',
            'replies.user',
            'replies.attachments',
            'replies.reactions.user',
            'replies.keyWraps',
            'keyWraps',
        ]);

        return new MessageResource($message);
    }

    public function react(StoreReactionRequest $request, Workspace $workspace, Channel $channel, Message $message): MessageResource
    {
        $this->authorize('view', $message);

        $message->reactions()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['emoji' => $request->validated('emoji')],
        );

        $message->load(['reactions.user', 'keyWraps']);

        return new MessageResource($message);
    }

    public function destroy(Request $request, Workspace $workspace, Channel $channel, Message $message): Response
    {
        $this->authorize('delete', $message);

        $message->delete();

        return response()->noContent();
    }

    private function keyWrapsFrom(?string $raw): array
    {
        if ($raw === null) {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return [];
        }

        return collect($decoded)
            ->filter(function (mixed $wrap) {
                return is_array($wrap)
                    && isset($wrap['user_id'], $wrap['ephemeral_public_key'], $wrap['wrapped_key'], $wrap['wrap_iv'])
                    && is_numeric($wrap['user_id']);
            })
            ->map(fn (array $wrap): array => [
                'user_id' => (int) $wrap['user_id'],
                'ephemeral_public_key' => (string) $wrap['ephemeral_public_key'],
                'wrapped_key' => (string) $wrap['wrapped_key'],
                'wrap_iv' => (string) $wrap['wrap_iv'],
            ])
            ->values()
            ->all();
    }

    private function eligibleRecipientIds(Channel $channel)
    {
        if ($channel->type->value === 'public') {
            return WorkspaceMember::where('workspace_id', $channel->workspace_id)
                ->pluck('user_id');
        }

        return $channel->members()
            ->where('status', ChannelMemberStatus::Active->value)
            ->pluck('user_id');
    }
}
