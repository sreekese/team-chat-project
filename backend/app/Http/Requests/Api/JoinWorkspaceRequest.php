<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class JoinWorkspaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invite_code' => ['required', 'string', 'max:20', 'exists:workspaces,invite_code'],
        ];
    }

    public function messages(): array
    {
        return [
            'invite_code.exists' => 'That invite code is invalid or has expired.',
        ];
    }
}