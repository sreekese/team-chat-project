<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->string('invite_code', 20)->nullable()->unique()->after('slug');
        });

        DB::table('workspaces')->whereNull('invite_code')->orderBy('id')->chunkById(200, function ($workspaces) {
            foreach ($workspaces as $workspace) {
                DB::table('workspaces')
                    ->where('id', $workspace->id)
                    ->update(['invite_code' => Str::upper(Str::random(10))]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropUnique(['invite_code']);
            $table->dropColumn('invite_code');
        });
    }
};