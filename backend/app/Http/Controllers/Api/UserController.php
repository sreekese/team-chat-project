<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function search(Request $request): AnonymousResourceCollection
    {
        $q = trim((string) $request->query('q'));

        $users = User::query()
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($query) use ($q) {
                    $query->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($q).'%'])
                        ->orWhereRaw('LOWER(username) LIKE ?', ['%'.mb_strtolower($q).'%'])
                        ->orWhereRaw('LOWER(email) LIKE ?', ['%'.mb_strtolower($q).'%']);
                });
            })
            ->where('id', '!=', $request->user()->id)
            ->orderBy('name')
            ->limit((int) $request->query('limit', 20))
            ->get();

        return UserResource::collection($users);
    }
}