<?php

namespace App\Models;

use App\Enums\MessageType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['workspace_id', 'channel_id', 'user_id', 'parent_id', 'type', 'body', 'encrypted_body', 'body_iv', 'edited_at'])]
class Message extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'type' => MessageType::class,
            'edited_at' => 'datetime',
        ];
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function channel()
    {
        return $this->belongsTo(Channel::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(Message::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(Message::class, 'parent_id');
    }

    public function attachments()
    {
        return $this->hasMany(MessageAttachment::class);
    }

    public function keyWraps()
    {
        return $this->hasMany(MessageKeyWrap::class);
    }

    public function reactions()
    {
        return $this->hasMany(MessageReaction::class);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->whereFullText(['body'], $term);
    }
}
