<?php

namespace App\Models;

use App\Enums\ChannelType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable(['workspace_id', 'name', 'slug', 'type', 'description', 'created_by'])]
class Channel extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function (Channel $channel) {
            if (empty($channel->slug)) {
                $channel->slug = Str::of($channel->name)->slug('-')->limit(60)->append('-'.Str::lower(Str::random(6)));
            }
        });
    }

    protected function casts(): array
    {
        return [
            'type' => ChannelType::class,
        ];
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members()
    {
        return $this->hasMany(ChannelMember::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'channel_members')
            ->withTimestamps()
            ->withPivot(['role', 'status', 'last_read_at']);
    }
}
