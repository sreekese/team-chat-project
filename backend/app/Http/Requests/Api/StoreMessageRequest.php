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
            'body' => ['required_without:attachment', 'string', 'max:10000'],
            'type' => ['sometimes', Rule::enum(MessageType::class)],
            'parent_id' => ['sometimes', 'nullable', 'integer', 'exists:messages,id'],
            'attachment' => ['sometimes', 'file', 'max:25000'],
        ];
    }
}
