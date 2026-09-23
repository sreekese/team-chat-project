<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable(['name', 'slug', 'description', 'logo_path', 'settings', 'owner_id', 'invite_code'])]
class Workspace extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function (Workspace $workspace) {
            if (empty($workspace->slug)) {
                $workspace->slug = Str::slug($workspace->name);
            }

            $base = $workspace->slug ?: 'workspace';
            $slug = $base;
            $counter = 1;
            while (static::where('slug', $slug)->withTrashed()->exists()) {
                $slug = $base.'-'.$counter++;
                if ($counter > 20) {
                    $slug = $base.'-'.Str::lower(Str::random(6));
                    break;
                }
            }
            $workspace->slug = $slug;

            if (empty($workspace->invite_code)) {
                $workspace->invite_code = random_int(100000, 999999);
            }
        });
    }

    public function regenerateInviteCode(): static
    {
        $this->invite_code = random_int(100000, 999999);
        $this->save();

        return $this;
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
