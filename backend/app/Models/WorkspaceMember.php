<?php

namespace App\Models;

use App\Enums\WorkspaceMemberRole;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['workspace_id', 'user_id', 'role'])]
class WorkspaceMember extends Model
{
    protected function casts(): array
    {
        return [
            'role' => WorkspaceMemberRole::class,
        ];
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
