<?php

namespace App\Enums;

enum ChannelType: string
{
    case Public = 'public';
    case Private = 'private';
    case Dm = 'dm';
}
