import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ProfileMapper } from "./profile.mapper";
import { ProfileService } from "./profile.service";
import {
  ActivityItemResponseDto,
  NotificationPreferenceResponseDto,
  ProfileResponseDto,
  ProfileSecurityResponseDto,
  ProfileStatsResponseDto,
  ProfileWorkspaceResponseDto,
} from "./dto/profile-response.dto";
import { UpdateNotificationPreferencesDto } from "./dto/update-notification-preferences.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller("profile")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(): Promise<ProfileResponseDto> {
    const data = await this.profileService.getProfile();
    return ProfileMapper.toProfileDto(data);
  }

  @Patch()
  async updateProfile(@Body() body: UpdateProfileDto): Promise<ProfileResponseDto> {
    const data = await this.profileService.updateProfile(body);
    return ProfileMapper.toProfileDto(data);
  }

  @Get("stats")
  async getStats(): Promise<ProfileStatsResponseDto> {
    const data = await this.profileService.getStats();
    return ProfileMapper.toStatsDto(data);
  }

  @Get("security")
  async getSecurity(): Promise<ProfileSecurityResponseDto> {
    const data = await this.profileService.getSecurity();
    return ProfileMapper.toSecurityDto(data);
  }

  @Get("workspaces")
  async getWorkspaces(): Promise<ProfileWorkspaceResponseDto> {
    const data = await this.profileService.getWorkspaces();
    return ProfileMapper.toWorkspaceDto(data);
  }

  @Get("activity")
  async getActivity(): Promise<ActivityItemResponseDto[]> {
    const data = await this.profileService.getProfile();
    return ProfileMapper.toActivityDtos(data);
  }

  @Get("notifications")
  async getNotifications(): Promise<NotificationPreferenceResponseDto[]> {
    const data = await this.profileService.getProfile();
    return ProfileMapper.toNotificationDtos(data);
  }

  @Patch("notifications")
  async updateNotifications(
    @Body() body: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferenceResponseDto[]> {
    await this.profileService.updateNotificationPreferences(body);
    const data = await this.profileService.getProfile();
    return ProfileMapper.toNotificationDtos(data);
  }
}
