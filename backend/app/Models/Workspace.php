<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable(['name', 'slug', 'description', 'logo_path', 'settings', 'owner_id'])]
class Workspace extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function (Workspace $workspace) {
            if (empty($workspace->slug)) {
                $workspace->slug = Str::slug($workspace->name);
            }
        });
    }

    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members()
    {
        return $this->hasMany(WorkspaceMember::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'workspace_members')
            ->withTimestamps()
            ->withPivot('role');
    }

    public function channels()
    {
        return $this->hasMany(Channel::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
