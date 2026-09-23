<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class KeyController extends Controller
{
    public function store(Request $request): UserResource
    {
        $validated = $request->validate([
            'identity_public_key' => ['required', 'string'],
            'encryption_public_key' => ['required', 'string'],
            'encryption_key_signature' => ['required', 'string'],
        ]);

        $user = $request->user();
        $user->fill($validated)->save();

        return new UserResource($user);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}