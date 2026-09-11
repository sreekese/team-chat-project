<?php

namespace App\Models;

use App\Enums\ChannelMemberRole;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['channel_id', 'user_id', 'role', 'last_read_at'])]
class ChannelMember extends Model
{
    protected function casts(): array
    {
        return [
            'role' => ChannelMemberRole::class,
            'last_read_at' => 'datetime',
        ];
    }

    public function channel()
    {
        return $this->belongsTo(Channel::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
