def role_is(user, *roles):
    return user.is_authenticated and (user.is_superuser or user.role in roles)
