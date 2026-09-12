<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkspaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:workspaces,slug'],
            'description' => ['nullable', 'string', 'max:1000'],
            'logo_path' => ['nullable', 'string', 'max:500'],
            'settings' => ['nullable', 'array'],
        ];
    }
}
