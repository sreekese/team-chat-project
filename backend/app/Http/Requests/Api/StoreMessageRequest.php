<?php

namespace App\Http\Requests\Api;

use App\Enums\MessageType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required_without_all:encrypted_body,attachment', 'nullable', 'string', 'max:10000'],
            'type' => ['sometimes', Rule::enum(MessageType::class)],
            'parent_id' => ['sometimes', 'nullable', 'integer', 'exists:messages,id'],
            'attachment' => ['sometimes', 'file', 'max:25000'],
            'encrypted_body' => ['nullable', 'string'],
            'body_iv' => ['required_with:encrypted_body', 'string'],
            'key_wraps' => ['required_with:encrypted_body', 'string'],
        ];
    }
}
