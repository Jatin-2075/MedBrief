from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests
from rest_framework.permissions import IsAuthenticated

@api_view(["POST"])
def google_login(request):
    token = request.data.get("token")

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            "581363368131-t1pt9mkp31imk8uhvtg3gdr1vn03kavp.apps.googleusercontent.com"
        )

        email = idinfo["email"]
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")

        user, created = User.objects.get_or_create(
            username=email,
            defaults={"first_name": name, "email": email}
        )

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "name": name,
            "email": email,
            "picture": picture
        })

    except Exception as e:
        return Response({"error": "Invalid Google token"}, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_data(request):
    user = request.user
    return Response({
        "name": user.first_name,
        "email": user.email
    })
