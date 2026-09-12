<?php

namespace App\Http\Controllers\Api;

use App\Enums\MessageType;
use App\Events\MessageCreated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreMessageRequest;
use App\Http\Requests\Api\StoreReactionRequest;
use App\Http\Resources\MessageResource;
use App\Models\Channel;
use App\Models\Message;
use App\Models\MessageAttachment;
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
            ->with(['user', 'attachments', 'reactions.user'])
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

        $message = $channel->messages()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $request->user()->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'type' => $file ? MessageType::File : ($validated['type'] ?? MessageType::Text),
            'body' => $file ? $file->getClientOriginalName() : ($validated['body'] ?? ''),
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

        $message->load('user');

        broadcast(new MessageCreated($message));

        return new MessageResource($message);
    }

    public function show(Request $request, Workspace $workspace, Channel $channel, Message $message): MessageResource
    {
        $this->authorize('view', $message);

        $message->load(['user', 'attachments', 'reactions.user', 'replies.user']);

        return new MessageResource($message);
    }

    public function react(StoreReactionRequest $request, Workspace $workspace, Channel $channel, Message $message): MessageResource
    {
        $this->authorize('view', $message);

        $message->reactions()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['emoji' => $request->validated('emoji')],
        );

        $message->load('reactions.user');

        return new MessageResource($message);
    }

    public function destroy(Request $request, Workspace $workspace, Channel $channel, Message $message): Response
    {
        $this->authorize('delete', $message);

        $message->delete();

        return response()->noContent();
    }
}
