<?php

namespace App\Enums;

enum ChannelMemberRole: string
{
    case Admin = 'admin';
    case Member = 'member';
}
