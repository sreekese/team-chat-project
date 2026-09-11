<?php

namespace App\Enums;

enum UserStatus: string
{
    case Online = 'online';
    case Away = 'away';
    case Offline = 'offline';
}
