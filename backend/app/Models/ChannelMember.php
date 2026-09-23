<?php

namespace App\Models;

use App\Enums\ChannelMemberRole;
use App\Enums\ChannelMemberStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['channel_id', 'user_id', 'role', 'status', 'last_read_at'])]
class ChannelMember extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'role' => ChannelMemberRole::class,
            'status' => ChannelMemberStatus::class,
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
