<?php

namespace App\Enums;

enum ChannelMemberStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
}
