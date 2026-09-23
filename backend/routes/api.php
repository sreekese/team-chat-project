<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChannelController;
use App\Http\Controllers\Api\DirectMessageController;
use App\Http\Controllers\Api\KeyController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/keys', [KeyController::class, 'me']);
    Route::post('/keys', [KeyController::class, 'store']);

    Route::get('users/search', [UserController::class, 'search']);

    Route::post('workspaces/join', [WorkspaceController::class, 'join']);

    Route::apiResource('workspaces', WorkspaceController::class)->only(['index', 'store', 'show', 'destroy']);

    Route::get('workspaces/{workspace}/members', [WorkspaceController::class, 'members']);
    Route::post('workspaces/{workspace}/members', [WorkspaceController::class, 'addMember']);
    Route::delete('workspaces/{workspace}/members/{user}', [WorkspaceController::class, 'removeMember']);
    Route::post('workspaces/{workspace}/invite', [WorkspaceController::class, 'regenerateInvite']);

    // Global direct messages (outside workspaces)
    Route::get('dms', [DirectMessageController::class, 'index']);
    Route::post('dms', [DirectMessageController::class, 'store']);
    Route::delete('dms/{channel}', [DirectMessageController::class, 'destroy']);

    Route::post('workspaces/{workspace}/dms', [ChannelController::class, 'dms']);

    Route::get('workspaces/{workspace}/channels', [ChannelController::class, 'index']);
    Route::post('workspaces/{workspace}/channels', [ChannelController::class, 'store']);
    Route::post('workspaces/{workspace}/channels/{channel}/accept', [ChannelController::class, 'accept']);
    Route::delete('workspaces/{workspace}/channels/{channel}/decline', [ChannelController::class, 'decline']);
    Route::delete('workspaces/{workspace}/channels/{channel}', [ChannelController::class, 'destroy']);
    Route::delete('workspaces/{workspace}/channels/{channel}/leave', [ChannelController::class, 'leave']);
    Route::get('workspaces/{workspace}/channels/{channel}', [ChannelController::class, 'show']);

    Route::get('workspaces/{workspace}/channels/{channel}/messages', [MessageController::class, 'index']);
    Route::post('workspaces/{workspace}/channels/{channel}/messages', [MessageController::class, 'store']);
    Route::get('workspaces/{workspace}/channels/{channel}/messages/{message}', [MessageController::class, 'show']);
    Route::post('workspaces/{workspace}/channels/{channel}/messages/{message}/react', [MessageController::class, 'react']);
    Route::delete('workspaces/{workspace}/channels/{channel}/messages/{message}', [MessageController::class, 'destroy']);
});
