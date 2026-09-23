<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('identity_public_key')->nullable();
            $table->text('encryption_public_key')->nullable();
            $table->text('encryption_key_signature')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['identity_public_key', 'encryption_public_key', 'encryption_key_signature']);
        });
    }
};