<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class AddWorkspaceMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required_without:email', 'nullable', 'integer', 'exists:users,id'],
            'email' => ['required_without:user_id', 'nullable', 'email', 'exists:users,email'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required_without' => 'Provide a user id or email.',
            'email.required_without' => 'Provide a user id or email.',
            'email.exists' => 'No user found with that email.',
            'user_id.exists' => 'No user found with that id.',
        ];
    }
}