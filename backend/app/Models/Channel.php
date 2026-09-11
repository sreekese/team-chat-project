<?php

namespace App\Models;

use App\Enums\ChannelType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['workspace_id', 'name', 'slug', 'type', 'description', 'created_by'])]
class Channel extends Model
{
    use SoftDeletes;

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
            ->withPivot(['role', 'last_read_at']);
    }
}
