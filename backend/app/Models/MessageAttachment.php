<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['message_id', 'file_path', 'file_name', 'mime_type', 'size', 'meta'])]
class MessageAttachment extends Model
{
    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'meta' => 'array',
        ];
    }

    public function message()
    {
        return $this->belongsTo(Message::class);
    }
}
