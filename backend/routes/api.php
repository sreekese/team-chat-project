<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChannelController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('workspaces', WorkspaceController::class)->only(['index', 'store', 'show']);

    Route::get('workspaces/{workspace}/channels', [ChannelController::class, 'index']);
    Route::post('workspaces/{workspace}/channels', [ChannelController::class, 'store']);
    Route::get('workspaces/{workspace}/channels/{channel}', [ChannelController::class, 'show']);

    Route::get('workspaces/{workspace}/channels/{channel}/messages', [MessageController::class, 'index']);
    Route::post('workspaces/{workspace}/channels/{channel}/messages', [MessageController::class, 'store']);
    Route::get('workspaces/{workspace}/channels/{channel}/messages/{message}', [MessageController::class, 'show']);
    Route::post('workspaces/{workspace}/channels/{channel}/messages/{message}/react', [MessageController::class, 'react']);
    Route::delete('workspaces/{workspace}/channels/{channel}/messages/{message}', [MessageController::class, 'destroy']);
});
