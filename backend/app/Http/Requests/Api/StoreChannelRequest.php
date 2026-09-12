<?php

namespace App\Http\Requests\Api;

use App\Enums\ChannelType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreChannelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('channels', 'slug')->where('workspace_id', $this->route('workspace')?->id ?? $this->input('workspace_id'))],
            'type' => ['required', Rule::enum(ChannelType::class)],
            'description' => ['nullable', 'string', 'max:1000'],
            'member_ids' => ['sometimes', 'array'],
            'member_ids.*' => ['required', 'integer', 'exists:users,id'],
        ];
    }
}
